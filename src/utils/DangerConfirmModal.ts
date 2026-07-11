import { App, Modal } from "obsidian";

/**
 * 跨平台确认（替代全局 confirm，桌面/移动端均可用）。
 * 保持同步守卫语义：
 *   const ok = await confirmAsync(this.app, { message: "..." });
 *   if (!ok) return;
 */
export function confirmAsync(
	app: App,
	options: { message: string; title?: string; confirmText?: string },
): Promise<boolean> {
	return new Promise((resolve) => {
		const modal = new ConfirmModal(app, {
			message: options.message,
			title: options.title,
			confirmText: options.confirmText,
			onResolve: resolve,
		});
		modal.open();
	});
}

class ConfirmModal extends Modal {
	private message: string;
	private titleText: string;
	private confirmText: string;
	private onResolve: (result: boolean) => void;

	constructor(
		app: App,
		options: { message: string; title?: string; confirmText?: string; onResolve: (result: boolean) => void },
	) {
		super(app);
		this.message = options.message;
		this.titleText = options.title ?? "确认操作";
		this.confirmText = options.confirmText ?? "确认";
		this.onResolve = options.onResolve;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createDiv({ cls: "piclinker-confirm-title", text: this.titleText });
		contentEl.createEl("p", { text: this.message });

		const btnRow = contentEl.createDiv({ cls: "modal-button-row piclinker-confirm-actions" });

		const cancelBtn = btnRow.createEl("button", { text: "取消" });
		cancelBtn.addEventListener("click", () => {
			this.onResolve(false);
			this.close();
		});

		const confirmBtn = btnRow.createEl("button", { text: this.confirmText, cls: "mod-warning" });
		confirmBtn.addEventListener("click", () => {
			this.onResolve(true);
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
