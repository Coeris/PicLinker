/**
 * 图片预览 Modal
 * 从 PicLinkerView 提取的图片预览逻辑
 */

/** 显示图片预览弹窗（支持滚轮缩放、双击重置、Escape 关闭） */
export function showImagePreview(src: string): void {
	const overlay = activeDocument.createElement("div");
	overlay.className = "pic-preview-overlay";
	const img = activeDocument.createElement("img");
	img.className = "pic-preview-img";
	img.src = src;

	let scale = 1;

	// 统一关闭清理函数
	const close = () => {
		overlay.remove();
		activeDocument.removeEventListener("keydown", onKeyDown);
	};

	// 滚轮缩放
	overlay.addEventListener("wheel", (e) => {
		e.preventDefault();
		scale = e.deltaY < 0 ? Math.min(scale * 1.15, 10) : Math.max(scale / 1.15, 0.1);
		img.setCssStyles({ transform: `scale(${scale})` });
	});

	// 点击图片不关闭
	img.addEventListener("click", (e) => e.stopPropagation());
	// 双击图片重置缩放
	img.addEventListener("dblclick", (e) => {
		e.stopPropagation();
		scale = 1;
		img.setCssStyles({ transform: "scale(1)" });
	});
	// 点击遮罩关闭
	overlay.addEventListener("click", close);
	// Escape 键关闭
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") close();
	};
	activeDocument.addEventListener("keydown", onKeyDown);

	overlay.appendChild(img);
	activeDocument.body.appendChild(overlay);
}
