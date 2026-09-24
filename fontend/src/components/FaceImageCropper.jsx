import { useState, useRef, useEffect, useCallback } from "react";
import "./FaceImageCropper.css";

/**
 * FaceImageCropper - Hộp thoại cắt ảnh tự do chuẩn xác
 * - Hiển thị NGUYÊN BẢN toàn bộ ảnh chụp (KHÔNG tự động zoom to, không méo, không mất góc).
 * - Cho phép kéo di chuyển khung cắt và kéo 4 góc để phóng to/thu nhỏ vùng cần lấy.
 * - Có nút "Dùng toàn bộ ảnh gốc" để người dùng bỏ qua bước cắt nếu ảnh chụp đã vừa vặn.
 * - Xuất đúng kích thước vùng người dùng đã chọn (1:1 pixel, giữ nguyên độ nét gốc).
 */
export default function FaceImageCropper({ imageSrc, onCancel, onConfirm }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [crop, setCrop] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [dragMode, setDragMode] = useState(null); // null | "move" | "tl" | "tr" | "bl" | "br"
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: null });
  const [canvasDims, setCanvasDims] = useState({ width: 440, height: 440 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // Tải hình ảnh gốc
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);

      // Tính kích thước hiển thị vừa vặn trong khung 460 x 460 nhưng giữ nguyên tỉ lệ gốc của ảnh
      const maxW = Math.min(window.innerWidth - 48, 460);
      const maxH = Math.min(window.innerHeight - 280, 460);
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);

      const displayW = Math.max(260, Math.round(img.width * scale));
      const displayH = Math.max(260, Math.round(img.height * scale));

      setCanvasDims({ width: displayW, height: displayH });

      // Mặc định chọn 90% diện tích khuôn mặt/ảnh gốc để bao trọn từ trán đến cằm
      setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Vẽ hình ảnh và khung cắt lên Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvasDims;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 1. Vẽ toàn bộ ảnh gốc (100% nguyên bản, KHÔNG zoom, không cắt xén)
    ctx.drawImage(img, 0, 0, width, height);

    // Tọa độ pixel của khung cắt trên canvas
    const boxX = crop.x * width;
    const boxY = crop.y * height;
    const boxW = crop.w * width;
    const boxH = crop.h * height;

    // 2. Phủ lớp mờ tối bên ngoài vùng chọn để làm nổi bật vùng giữ lại
    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    // Vùng trên
    ctx.fillRect(0, 0, width, boxY);
    // Vùng dưới
    ctx.fillRect(0, boxY + boxH, width, height - (boxY + boxH));
    // Vùng trái
    ctx.fillRect(0, boxY, boxX, boxH);
    // Vùng phải
    ctx.fillRect(boxX + boxW, boxY, width - (boxX + boxW), boxH);

    // 3. Đường lưới chia 3 (Rule of thirds) bên trong khung cắt
    ctx.strokeStyle = "rgba(255, 215, 0, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 2 đường dọc
    ctx.moveTo(boxX + boxW / 3, boxY);
    ctx.lineTo(boxX + boxW / 3, boxY + boxH);
    ctx.moveTo(boxX + (boxW * 2) / 3, boxY);
    ctx.lineTo(boxX + (boxW * 2) / 3, boxY + boxH);
    // 2 đường ngang
    ctx.moveTo(boxX, boxY + boxH / 3);
    ctx.lineTo(boxX + boxW, boxY + boxH / 3);
    ctx.moveTo(boxX, boxY + (boxH * 2) / 3);
    ctx.lineTo(boxX + boxW, boxY + (boxH * 2) / 3);
    ctx.stroke();

    // 4. Viền vàng sắc nét của khung cắt
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // 5. Vẽ 4 tay nắm góc (Corner handles) để người dùng kéo chỉnh kích thước
    const handleLen = 18;
    const handleThick = 4;
    ctx.fillStyle = "#ffd700";

    // Top-Left
    ctx.fillRect(boxX - 2, boxY - 2, handleLen, handleThick);
    ctx.fillRect(boxX - 2, boxY - 2, handleThick, handleLen);

    // Top-Right
    ctx.fillRect(boxX + boxW - handleLen + 2, boxY - 2, handleLen, handleThick);
    ctx.fillRect(boxX + boxW - handleThick + 2, boxY - 2, handleThick, handleLen);

    // Bottom-Left
    ctx.fillRect(boxX - 2, boxY + boxH - handleThick + 2, handleLen, handleThick);
    ctx.fillRect(boxX - 2, boxY + boxH - handleLen + 2, handleThick, handleLen);

    // Bottom-Right
    ctx.fillRect(boxX + boxW - handleLen + 2, boxY + boxH - handleThick + 2, handleLen, handleThick);
    ctx.fillRect(boxX + boxW - handleThick + 2, boxY + boxH - handleLen + 2, handleThick, handleLen);
  }, [imageLoaded, crop, canvasDims]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Xác định vị trí nhấn chuột / ngón tay (chạm vào 4 góc hay chạm vào giữa khung)
  const getHitZone = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { width, height } = canvasDims;
    const boxX = crop.x * width;
    const boxY = crop.y * height;
    const boxW = crop.w * width;
    const boxH = crop.h * height;

    const hitThreshold = 26; // Vùng bắt dính tay nắm (pixel)

    // Kiểm tra 4 góc
    if (Math.abs(x - boxX) < hitThreshold && Math.abs(y - boxY) < hitThreshold) return "tl";
    if (Math.abs(x - (boxX + boxW)) < hitThreshold && Math.abs(y - boxY) < hitThreshold) return "tr";
    if (Math.abs(x - boxX) < hitThreshold && Math.abs(y - (boxY + boxH)) < hitThreshold) return "bl";
    if (Math.abs(x - (boxX + boxW)) < hitThreshold && Math.abs(y - (boxY + boxH)) < hitThreshold) return "br";

    // Kiểm tra bên trong khung
    if (x >= boxX && x <= boxX + boxW && y >= boxY && y <= boxY + boxH) return "move";

    return null;
  };

  // Xử lý kéo thả (Mouse & Touch)
  const handleStart = (clientX, clientY) => {
    const mode = getHitZone(clientX, clientY);
    if (mode) {
      setDragMode(mode);
      setDragStart({ x: clientX, y: clientY, crop: { ...crop } });
    }
  };

  const handleMove = (clientX, clientY) => {
    if (!dragMode || !dragStart.crop) return;

    const dx = (clientX - dragStart.x) / canvasDims.width;
    const dy = (clientY - dragStart.y) / canvasDims.height;
    const initial = dragStart.crop;

    const minSize = 0.2; // Tối thiểu 20% kích thước ảnh

    let newX = initial.x;
    let newY = initial.y;
    let newW = initial.w;
    let newH = initial.h;

    if (dragMode === "move") {
      newX = Math.max(0, Math.min(1 - initial.w, initial.x + dx));
      newY = Math.max(0, Math.min(1 - initial.h, initial.y + dy));
    } else if (dragMode === "br") {
      newW = Math.max(minSize, Math.min(1 - initial.x, initial.w + dx));
      newH = Math.max(minSize, Math.min(1 - initial.y, initial.h + dy));
    } else if (dragMode === "tl") {
      const targetRight = initial.x + initial.w;
      const targetBottom = initial.y + initial.h;
      newX = Math.max(0, Math.min(targetRight - minSize, initial.x + dx));
      newY = Math.max(0, Math.min(targetBottom - minSize, initial.y + dy));
      newW = targetRight - newX;
      newH = targetBottom - newY;
    } else if (dragMode === "tr") {
      const targetBottom = initial.y + initial.h;
      newY = Math.max(0, Math.min(targetBottom - minSize, initial.y + dy));
      newW = Math.max(minSize, Math.min(1 - initial.x, initial.w + dx));
      newH = targetBottom - newY;
    } else if (dragMode === "bl") {
      const targetRight = initial.x + initial.w;
      newX = Math.max(0, Math.min(targetRight - minSize, initial.x + dx));
      newW = targetRight - newX;
      newH = Math.max(minSize, Math.min(1 - initial.y, initial.h + dy));
    }

    setCrop({
      x: Number(newX.toFixed(4)),
      y: Number(newY.toFixed(4)),
      w: Number(newW.toFixed(4)),
      h: Number(newH.toFixed(4))
    });
  };

  const handleEnd = () => {
    setDragMode(null);
  };

  // Xác nhận cắt & đưa vào phân tích (ĐÚNG NGUYÊN KÍCH THƯỚC VÙNG CẮT, KHÔNG ZOOM)
  const handleConfirmCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;

    const cropPxX = Math.max(0, Math.round(crop.x * natW));
    const cropPxY = Math.max(0, Math.round(crop.y * natH));
    const cropPxW = Math.min(natW - cropPxX, Math.round(crop.w * natW));
    const cropPxH = Math.min(natH - cropPxY, Math.round(crop.h * natH));

    if (cropPxW <= 10 || cropPxH <= 10) {
      onConfirm(imageSrc);
      return;
    }

    const outCanvas = document.createElement("canvas");
    outCanvas.width = cropPxW;
    outCanvas.height = cropPxH;
    const ctx = outCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Cắt trực tiếp vùng người dùng đã chọn từ ảnh gốc, tỉ lệ 1:1, không hề zoom to phóng đại
    ctx.drawImage(img, cropPxX, cropPxY, cropPxW, cropPxH, 0, 0, cropPxW, cropPxH);

    const croppedDataUrl = outCanvas.toDataURL("image/jpeg", 0.95);
    onConfirm(croppedDataUrl);
  };

  // Nút bỏ qua cắt: Giữ nguyên 100% ảnh gốc
  const handleUseOriginal = () => {
    onConfirm(imageSrc);
  };

  return (
    <div className="face-cropper-modal-overlay">
      <div className="face-cropper-modal-container">
        {/* HEADER */}
        <div className="face-cropper-header">
          <div className="face-cropper-badge">📐 CẮT &amp; CHỌN VÙNG KHUÔN MẶT</div>
          <h3 className="face-cropper-title">Tùy Chọn Vùng Cắt Khuôn Mặt</h3>
          <p className="face-cropper-subtitle">
            Kéo khung vàng hoặc kéo 4 góc để chọn vùng mặt cần phân tích (từ trán đến cằm). Ảnh hiển thị nguyên bản, không bị phóng to.
          </p>
        </div>

        {/* WORKSPACE PREVIEW CANVAS */}
        <div
          className="face-cropper-canvas-wrap"
          ref={containerRef}
          style={{ width: canvasDims.width, height: canvasDims.height }}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => e.touches.length && handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => e.touches.length && handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          <canvas
            ref={canvasRef}
            width={canvasDims.width}
            height={canvasDims.height}
            className={`face-cropper-canvas ${dragMode ? "is-dragging" : ""}`}
          />

          <div className="face-cropper-guide-badge">
            <span>🖐️ Kéo khung vàng để di chuyển • Kéo 4 góc để mở rộng vùng cắt</span>
          </div>
        </div>

        {/* TOOLBAR NÚT HÀNH ĐỘNG */}
        <div className="face-cropper-footer">
          <button type="button" className="cropper-btn-cancel" onClick={onCancel}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="cropper-btn-secondary"
            onClick={handleUseOriginal}
            title="Dùng nguyên bản toàn bộ ảnh chụp mà không cắt"
          >
            🖼️ Giữ nguyên ảnh gốc
          </button>
          <button
            type="button"
            className="cropper-btn-confirm"
            onClick={handleConfirmCrop}
            title="Cắt đúng theo khung vàng và bắt đầu phân tích"
          >
            ✨ Cắt &amp; Phân tích da
          </button>
        </div>
      </div>
    </div>
  );
}
