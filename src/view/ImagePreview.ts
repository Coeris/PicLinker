/**
 * 图片预览 Modal
 * 从 PicLinkerView 提取的图片预览逻辑
 */

/** 显示图片预览弹窗（支持滚轮缩放、鼠标/触摸拖拽、双指缩放、双击重置、Escape 关闭） */
export function showImagePreview(src: string): void {
	// 优先使用 activeDocument.body，fallback 到 document.body
	// 修复某些上下文下 activeDocument 状态异常导致 HierarchyRequestError
	const rootEl = (activeDocument.body || document.body);
	const doc = activeDocument;

	const overlay = rootEl.createEl("div", { cls: "pic-preview-overlay" });
	const img = rootEl.createEl("img", { cls: "pic-preview-img" });
	img.src = src;

	let scale = 1;
	let tx = 0;
	let ty = 0;

	// 拖拽识别阈值（像素）：小于该位移视为点击，不触发 didDrag，避免轻微抖动误吞关闭
	const DRAG_THRESHOLD = 4;
	// 鼠标/触摸拖拽平移状态（统一抽象）
	let dragging = false;
	let didDrag = false;
	let startX = 0;
	let startY = 0;
	let startTx = 0;
	let startTy = 0;

	// 触屏手势状态
	let pinchStartDist = 0;
	let pinchStartScale = 1;
	let lastTapTime = 0;

	// 应用当前变换（translate + scale 组合）
	const applyTransform = () => {
		img.setCssStyles({ transform: `translate(${tx}px, ${ty}px) scale(${scale})` });
	};

	// 滚轮缩放（保留当前平移偏移，仅改变缩放）
	const onWheel = (e: WheelEvent) => {
		e.preventDefault();
		scale = e.deltaY < 0 ? Math.min(scale * 1.15, 10) : Math.max(scale / 1.15, 0.1);
		applyTransform();
	};

	// 点击图片不关闭
	const onImgClick = (e: MouseEvent) => {
		e.stopPropagation();
	};
	// 双击图片重置缩放与平移
	const onImgDblClick = (e: MouseEvent) => {
		e.stopPropagation();
		scale = 1;
		tx = 0;
		ty = 0;
		applyTransform();
	};

	// 触屏双指中心距离（用于 pinch 缩放）
	const touchDist = (t1: Touch, t2: Touch): number => {
		const dx = t1.clientX - t2.clientX;
		const dy = t1.clientY - t2.clientY;
		return Math.hypot(dx, dy);
	};

	// 触屏：touchstart — 单指开始拖拽 / 双指开始 pinch
	const onTouchStart = (e: TouchEvent) => {
		e.stopPropagation();
		if (e.touches.length === 1) {
			// 单指：拖拽平移 + 触发"快速双击重置"
			const t = e.touches[0];
			dragging = true;
			didDrag = false;
			startX = t.clientX;
			startY = t.clientY;
			startTx = tx;
			startTy = ty;

			// 双击重置：第二次 tap 在 300ms 内才生效，仅按时间判定（坐标偏离未比较）
			const now = Date.now();
			const dt = now - lastTapTime;
			if (dt < 300 && dt > 0) {
				scale = 1;
				tx = 0;
				ty = 0;
				applyTransform();
				lastTapTime = 0; // 防止连击多次重置
			} else {
				lastTapTime = now;
			}
		} else if (e.touches.length === 2) {
			// 双指：pinch 缩放
			dragging = false;
			pinchStartDist = touchDist(e.touches[0], e.touches[1]);
			pinchStartScale = scale;
		}
	};

	// 触屏：touchmove — 拖拽平移 / pinch 缩放
	const onTouchMoveImg = (e: TouchEvent) => {
		if (e.touches.length === 1 && dragging) {
			const t = e.touches[0];
			tx = startTx + (t.clientX - startX);
			ty = startTy + (t.clientY - startY);
			if (Math.abs(t.clientX - startX) > DRAG_THRESHOLD || Math.abs(t.clientY - startY) > DRAG_THRESHOLD) didDrag = true;
			applyTransform();
		} else if (e.touches.length === 2 && pinchStartDist > 0) {
			const d = touchDist(e.touches[0], e.touches[1]);
			if (d > 0) {
				const newScale = pinchStartScale * (d / pinchStartDist);
				scale = Math.min(Math.max(newScale, 0.1), 10);
				applyTransform();
			}
		}
	};

	// 触屏：touchend — 结束拖拽 / pinch
	// 同时重置全部起始状态，避免双指回到单指时 startX/Y 残留导致后续拖动跳变（A-2 修复）。
	// 结束即重置 didDrag：本次触摸产生的拖拽已在 drag-end click 中被吞，后续独立点按应正常关闭。
	const onTouchEnd = () => {
		dragging = false;
		didDrag = false;
		pinchStartDist = 0;
		startX = 0;
		startY = 0;
		startTx = 0;
		startTy = 0;
	};
	// 点击遮罩关闭（鼠标 click 与触屏 click 共用同一入口；拖拽越过图片到遮罩松手时浏览器仍可能派发 click，用 didDrag 标记拦截误关）
	const onOverlayClick = () => { if (didDrag) { didDrag = false; return; } close(); };
	// Escape 键关闭
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") close();
	};
	// 移动端：阻止背景内容跟随滚动（overlay 上）
	const onTouchMove = (e: TouchEvent) => {
		// 单指在 img 上才拦截（让拖拽和 pinch 工作）；双指/三指交给浏览器
		if (e.touches.length === 1) e.preventDefault();
	};
	// 图片加载失败提示
	const onImgError = () => {
		img.setCssStyles({ display: "none" });
		const tip = rootEl.createEl("div", { cls: "pic-preview-error", text: "⚠ 图片无法加载" });
		overlay.appendChild(tip);
	};
	// 鼠标拖拽平移
	const onImgMouseDown = (e: MouseEvent) => {
		e.stopPropagation();
		didDrag = false;
		dragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startTx = tx;
		startTy = ty;
	};
	const onMouseMove = (e: MouseEvent) => {
		if (!dragging) return;
		tx = startTx + (e.clientX - startX);
		ty = startTy + (e.clientY - startY);
		if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD) didDrag = true;
		applyTransform();
	};
	const onMouseUp = () => {
		if (!dragging) return;
		dragging = false;
	};

	// 统一关闭清理函数：显式移除全部事件监听器
	const close = () => {
		overlay.remove();
		doc.removeEventListener("keydown", onKeyDown);
		doc.removeEventListener("mousemove", onMouseMove);
		doc.removeEventListener("mouseup", onMouseUp);
		overlay.removeEventListener("wheel", onWheel);
		overlay.removeEventListener("click", onOverlayClick);
		overlay.removeEventListener("touchmove", onTouchMove);
		img.removeEventListener("click", onImgClick);
		img.removeEventListener("dblclick", onImgDblClick);
		img.removeEventListener("mousedown", onImgMouseDown);
		img.removeEventListener("touchstart", onTouchStart);
		img.removeEventListener("touchmove", onTouchMoveImg);
		img.removeEventListener("touchend", onTouchEnd);
		img.removeEventListener("error", onImgError);
	};

	overlay.addEventListener("wheel", onWheel);
	overlay.addEventListener("click", onOverlayClick);
	overlay.addEventListener("touchmove", onTouchMove, { passive: false });
	doc.addEventListener("keydown", onKeyDown);
	doc.addEventListener("mousemove", onMouseMove);
	doc.addEventListener("mouseup", onMouseUp);
	img.addEventListener("click", onImgClick);
	img.addEventListener("dblclick", onImgDblClick);
	img.addEventListener("mousedown", onImgMouseDown);
	img.addEventListener("touchstart", onTouchStart);
	img.addEventListener("touchmove", onTouchMoveImg, { passive: false });
	img.addEventListener("touchend", onTouchEnd);
	img.addEventListener("error", onImgError);

	overlay.appendChild(img);
	rootEl.appendChild(overlay);
}
