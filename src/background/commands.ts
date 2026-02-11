/**
 * 设置快捷键命令
 */
export function setupCommands() {
    chrome.commands.onCommand.addListener((command) => {
        if (command === 'quick_search') {
            // 打开弹窗并聚焦搜索框
            chrome.action.openPopup()
            // 可以通过消息通知popup聚焦搜索框
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    type: 'FOCUS_SEARCH'
                })
            }, 100)
        }
    })
}
