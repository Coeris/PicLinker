/**
 * 异步事件/定时器回调包装
 *
 * Obsidian 社区 Lint 的 no-misused-promises（checksVoidReturn）会标记
 * `addEventListener("click", async () => ...)` / `setTimeout(async () => ...)`
 * 这类「函数参数期望返回 void，却返回了 Promise」的写法。
 *
 * 用 onAsyncClick / deferAsync 把 async 回调包成「返回 void 的同步函数」，
 * 内部用 `void` 吞掉 Promise，既消除 Lint 警告，又保留 await 语义。
 */

/** 把 click 异步处理器包成同步 (ev: MouseEvent) => void */
export function onAsyncClick(handler: (ev: MouseEvent) => Promise<void>): (ev: MouseEvent) => void {
	return (ev: MouseEvent) => {
		void handler(ev);
	};
}

/** 把无参异步任务包成同步 () => void，用于 setTimeout / setInterval */
export function deferAsync(fn: () => Promise<void>): () => void {
	return () => {
		void fn();
	};
}
