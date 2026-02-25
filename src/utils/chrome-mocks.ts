/**
 * Mocks for Chrome Extension APIs to allow the app to run in a web environment.
 */

if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.warn('Running in web mode: Chrome APIs are mocked.')

    const storage: Record<string, any> = JSON.parse(localStorage.getItem('chrome_storage_mock') || '{}')

    const mockChrome = {
        runtime: {
            id: 'mock-extension-id',
            getManifest: () => ({ version: '2.0.0' }),
            getURL: (path: string) => path,
            getPlatformInfo: () => Promise.resolve({ os: 'mac' }),
            sendMessage: (message: any, callback?: (response: any) => void) => {
                console.log('chrome.runtime.sendMessage', message)
                if (callback) setTimeout(() => callback({ success: true }), 0)
            },
            onMessage: {
                addListener: () => { }
            }
        },
        storage: {
            local: {
                get: (keys: string | string[] | Record<string, any> | null) => {
                    return new Promise((resolve) => {
                        if (keys === null) {
                            resolve({ ...storage })
                        } else if (typeof keys === 'string') {
                            resolve({ [keys]: storage[keys] })
                        } else if (Array.isArray(keys)) {
                            const result: Record<string, any> = {}
                            keys.forEach(k => result[k] = storage[k])
                            resolve(result)
                        } else {
                            resolve({ ...keys, ...storage })
                        }
                    })
                },
                set: (items: Record<string, any>) => {
                    return new Promise((resolve) => {
                        Object.assign(storage, items)
                        localStorage.setItem('chrome_storage_mock', JSON.stringify(storage))
                        resolve(undefined)
                    })
                },
                remove: (keys: string | string[]) => {
                    return new Promise((resolve) => {
                        if (typeof keys === 'string') {
                            delete storage[keys]
                        } else {
                            keys.forEach(k => delete storage[k])
                        }
                        localStorage.setItem('chrome_storage_mock', JSON.stringify(storage))
                        resolve(undefined)
                    })
                }
            }
        },
        tabs: {
            query: () => Promise.resolve([{ url: 'https://example.com', title: 'Example Page' }]),
            create: (params: any) => {
                window.open(params.url, '_blank')
            }
        },
        action: {
            setIcon: () => { },
            setBadgeText: () => { }
        },
        i18n: {
            getMessage: (key: string) => key
        }
    }

    // @ts-ignore
    window.chrome = mockChrome
}
