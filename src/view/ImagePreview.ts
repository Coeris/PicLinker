/**
 * 图片预览 Modal
 * 从 PicLinkerView 提取的图片预览逻辑
 */

/** 显示图片预览弹窗（支持滚轮缩放、拖拽平移、双击重置、Escape 关闭） */
export function showImagePreview(src: string): void {
	// 优先使用 activeDocument.body，fallback 到 document.body
	// 修复某些上下文下 activeDocument 状态异常导致 HierarchyRequestError
	const rootEl = (activeDocument.body || document.body);

	const overlay = rootEl.createEl("div", { cls: "pic-preview-overlay" });
	const img = rootEl.createEl("img", { cls: "pic-preview-img" });
	img.src = src;

	let scale = 1;
	let tx = 0;
	let ty = 0;

	// 拖拽平移状态
	let dragging = false;
	let startX = 0;
	let startY = 0;
	let startTx = 0;
	let startTy = 0;

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
	// 点击遮罩关闭
	const onOverlayClick = () => close();
	// Escape 键关闭
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") close();
	};
	// 移动端：阻止背景内容跟随滚动
	const onTouchMove = (e: TouchEvent) => {
		e.preventDefault();
	};
	// 图片加载失败提示
	const onImgError = () => {
		img.setCssStyles({ display: "none" });
		const tip = rootEl.createEl("div", { cls: "pic-preview-error", text: "⚠ 图片无法加载" });
		overlay.appendChild(tip);
	};
	// 拖拽平移
	const onImgMouseDown = (e: MouseEvent) => {
		e.stopPropagation();
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
		applyTransform();
	};
	const onMouseUp = () => {
		if (!dragging) return;
		dragging = false;
	};

	// 统一关闭清理函数：显式移除全部事件监听器
	const close = () => {
		overlay.remove();
		activeDocument.removeEventListener("keydown", onKeyDown);
		activeDocument.removeEventListener("mousemove", onMouseMove);
		activeDocument.removeEventListener("mouseup", onMouseUp);
		overlay.removeEventListener("wheel", onWheel);
		overlay.removeEventListener("click", onOverlayClick);
		overlay.removeEventListener("touchmove", onTouchMove);
		img.removeEventListener("click", onImgClick);
		img.removeEventListener("dblclick", onImgDblClick);
		img.removeEventListener("mousedown", onImgMouseDown);
		img.removeEventListener("error", onImgError);
	};

	overlay.addEventListener("wheel", onWheel);
	overlay.addEventListener("click", onOverlayClick);
	overlay.addEventListener("touchmove", onTouchMove, { passive: false });
	activeDocument.addEventListener("keydown", onKeyDown);
	activeDocument.addEventListener("mousemove", onMouseMove);
	activeDocument.addEventListener("mouseup", onMouseUp);
	img.addEventListener("click", onImgClick);
	img.addEventListener("dblclick", onImgDblClick);
	img.addEventListener("mousedown", onImgMouseDown);
	img.addEventListener("error", onImgError);

	overlay.appendChild(img);
	rootEl.appendChild(overlay);
}
