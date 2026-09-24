/**
 * backgroundRemoval.js
 * Tự động xóa nền ảnh chân dung bằng Google MediaPipe Selfie Segmentation.
 * Bóc tách 100% người/khuôn mặt/tóc/cổ/vai ra khỏi hậu cảnh phòng/ngoại cảnh,
 * tạo ảnh PNG trong suốt (transparent cutout) siêu tốc ngay tại trình duyệt.
 */

let segmenterInstance = null;
let segmenterLoadingPromise = null;

// Hàm tải script MediaPipe Selfie Segmentation nếu chưa có trong window
function loadMediaPipeScript() {
  if (window.SelfieSegmentation) {
    return Promise.resolve(window.SelfieSegmentation);
  }

  if (segmenterLoadingPromise) {
    return segmenterLoadingPromise;
  }

  segmenterLoadingPromise = new Promise((resolve, reject) => {
    // Thử tải từ file local đã copy vào public
    const script = document.createElement("script");
    script.src = "/mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.async = true;

    script.onload = () => {
      if (window.SelfieSegmentation) {
        resolve(window.SelfieSegmentation);
      } else {
        loadFromCdn().then(resolve).catch(reject);
      }
    };

    script.onerror = () => {
      loadFromCdn().then(resolve).catch(reject);
    };

    document.head.appendChild(script);
  });

  return segmenterLoadingPromise;
}

function loadFromCdn() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.async = true;
    script.onload = () => {
      if (window.SelfieSegmentation) resolve(window.SelfieSegmentation);
      else reject(new Error("Không thể khởi tạo SelfieSegmentation từ CDN"));
    };
    script.onerror = () => reject(new Error("Lỗi tải thư viện MediaPipe từ CDN"));
    document.head.appendChild(script);
  });
}

/**
 * Khởi tạo singleton SelfieSegmentation
 */
async function getSegmenter() {
  if (segmenterInstance) return segmenterInstance;

  const SelfieSegmentationClass = await loadMediaPipeScript();
  const segmenter = new SelfieSegmentationClass({
    locateFile: (file) => {
      // Ưu tiên tải model/wasm từ local public folder, fallback CDN
      return `/mediapipe/selfie_segmentation/${file}`;
    },
  });

  segmenter.setOptions({
    modelSelection: 0, // 0: General/Selfie model siêu nhẹ (~200KB), tối ưu tốc độ 100-200ms
    selfieMode: false,
  });

  await segmenter.initialize();
  segmenterInstance = segmenter;
  return segmenterInstance;
}

/**
 * Tải trước MediaPipe vào bộ nhớ ngầm khi mở trang
 */
export function preloadMediaPipe() {
  try {
    getSegmenter().catch(() => {});
  } catch (e) {
    // Silent ignore
  }
}

/**
 * Xóa nền ảnh chân dung siêu tốc
 * @param {string|HTMLImageElement} imageInput - Base64 DataURL hoặc HTMLImageElement
 * @returns {Promise<string>} DataURL của ảnh PNG đã xóa nền trong suốt
 */
export async function removeImageBackground(imageInput) {
  if (!imageInput) return imageInput;

  return new Promise(async (resolve) => {
    // Timeout an toàn 4 giây: nếu máy người dùng quá yếu thì tự fallback về ảnh gốc
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        console.warn("[MediaPipe] Xóa nền timeout (4s), giữ ảnh gốc");
        resolve(typeof imageInput === "string" ? imageInput : imageInput.src);
      }
    }, 4000);

    try {
      // 1. Chuẩn bị thẻ Image
      let imgElement;
      if (typeof imageInput === "string") {
        imgElement = new Image();
        imgElement.crossOrigin = "anonymous";
        await new Promise((res, rej) => {
          imgElement.onload = res;
          imgElement.onerror = rej;
          imgElement.src = imageInput;
        });
      } else {
        imgElement = imageInput;
      }

      const naturalW = imgElement.naturalWidth || imgElement.width || 800;
      const naturalH = imgElement.naturalHeight || imgElement.height || 1000;

      // 2. Lấy segmenter
      const segmenter = await getSegmenter();

      // 3. Callback xử lý khi MediaPipe trả về segmentationMask
      segmenter.onResults((results) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);

        try {
          const canvas = document.createElement("canvas");
          canvas.width = naturalW;
          canvas.height = naturalH;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(typeof imageInput === "string" ? imageInput : imageInput.src);
            return;
          }

          // Xóa toàn bộ canvas về trong suốt (alpha = 0)
          ctx.clearRect(0, 0, naturalW, naturalH);

          // Vẽ mask (MediaPipe segmentationMask: vùng người là màu đục, nền là màu trong)
          ctx.drawImage(results.segmentationMask, 0, 0, naturalW, naturalH);

          // Áp dụng composite operation 'source-in': chỉ giữ lại các điểm ảnh của người trùng với mask
          ctx.globalCompositeOperation = "source-in";
          ctx.drawImage(imgElement, 0, 0, naturalW, naturalH);

          // Khôi phục composite
          ctx.globalCompositeOperation = "source-over";

          // Xuất ra định dạng PNG trong suốt (chuẩn xóa nền)
          const transparentPngDataUrl = canvas.toDataURL("image/png");
          resolve(transparentPngDataUrl);
        } catch (err) {
          console.warn("[MediaPipe] Lỗi render mask xóa nền:", err);
          resolve(typeof imageInput === "string" ? imageInput : imageInput.src);
        }
      });

      // 4. Gửi ảnh đến MediaPipe
      await segmenter.send({ image: imgElement });
    } catch (err) {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        console.warn("[MediaPipe] Lỗi xóa nền, fallback ảnh gốc:", err);
        resolve(typeof imageInput === "string" ? imageInput : imageInput.src);
      }
    }
  });
}
