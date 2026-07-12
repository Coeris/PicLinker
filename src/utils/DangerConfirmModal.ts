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
	private resolved = false;

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

	/** 统一的解析入口，确保 Promise 只 resolve 一次（防止重复 resolve / 泄漏）。 */
	private resolve(result: boolean): void {
		if (this.resolved) return;
		this.resolved = true;
		this.onResolve(result);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createDiv({ cls: "piclinker-confirm-title", text: this.titleText });
		contentEl.createEl("p", { text: this.message });

		const btnRow = contentEl.createDiv({ cls: "modal-button-row piclinker-confirm-actions" });

		const cancelBtn = btnRow.createEl("button", { text: "取消" });
		cancelBtn.addEventListener("click", () => {
			this.resolve(false);
			this.close();
		});

		const confirmBtn = btnRow.createEl("button", { text: this.confirmText, cls: "mod-warning" });
		confirmBtn.addEventListener("click", () => {
			this.resolve(true);
			this.close();
		});
	}

	onClose(): void {
		// ESC / 点击背景关闭时，按「取消」语义 resolve(false)，保证调用方 await 不会永久挂起。
		this.resolve(false);
		this.contentEl.empty();
	}
}
