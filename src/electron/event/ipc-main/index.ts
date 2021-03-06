/* eslint-disable @typescript-eslint/no-unused-vars */
import { ipcMain, IpcMainEvent, BrowserWindow, screen, dialog } from 'electron'
import {
  Action,
  MiddlewareView,
  LyriceAction,
  UpdateType,
  DownloadIpcType,
  ReadLocalFile,
  Dialog,
  AutoDownload
} from '../action-types'
import { readFileSync } from 'fs'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import store from '@/electron/store/index'

export const onIpcMainEvent = (win: BrowserWindow) => {
  let syrice: null | BrowserWindow
  ipcMain.on(DownloadIpcType.SET_DOWNLOAD_PATH, (event, arg) => {
    store.set('downloadPath', arg)
  })
  ipcMain.on(Action.MINIMIZE_WINDOW, (event: IpcMainEvent) => {
    win.minimize()
  })
  ipcMain.on(Action.MAXIMIZE_WINDOW, (event: IpcMainEvent) => {
    win.maximize()
  })
  ipcMain.on(Action.RESTORE_WINDOW, (event: IpcMainEvent) => {
    win.restore()
  })
  ipcMain.on(Action.CLOSE_WINDOW, (event: IpcMainEvent) => {
    win.close()
    syrice && syrice.close()
  })
  ipcMain.on(UpdateType.UPDATE_WIDTH, (event: IpcMainEvent, width: number) => {
    if (syrice) {
      const screenWidth = screen.getPrimaryDisplay().workAreaSize.width
      syrice.setSize(Math.min(width + 40, screenWidth), 100)
    }
  })
  ipcMain.on(MiddlewareView.CREATE_WINDOW, (event: IpcMainEvent, arg) => {
    if (syrice) {
      if (syrice.isVisible()) {
        syrice.hide()
      } else {
        syrice.show()
      }
    } else {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      syrice = new BrowserWindow({
        width: width,
        height: 100,
        x: 0,
        y: height - 100,
        show: false,
        frame: false,
        titleBarStyle: 'hidden',
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        acceptFirstMouse: true,
        skipTaskbar: false,
        webPreferences: {
          nodeIntegration: true
        }
      })
      if (process.env.WEBPACK_DEV_SERVER_URL) {
        syrice.loadURL(process.env.WEBPACK_DEV_SERVER_URL + 'lyrice')
      } else {
        syrice.loadURL('app://./lyrice.html')
      }
      syrice.once('ready-to-show', () => {
        if (syrice) {
          syrice.show()
          syrice.webContents.send(LyriceAction.LYRICE_UPDATE_RENDER, {
            type: UpdateType.UPDATE_LYRICE,
            payload: arg
          })
        }
      })
      syrice.on('close', () => {
        win.webContents.send(LyriceAction.LYRICE_WIN_CLOSE)
      })
      syrice.on('closed', () => {
        syrice = null
      })
    }
  })
  ipcMain.on(MiddlewareView.UPDATE_THEME_COLOR, (event, arg) => {
    syrice && syrice.webContents.send(MiddlewareView.UPDATE_THEME_COLOR, arg)
  })
  ipcMain.on(
    LyriceAction.LYRICE_UPDATE,
    (
      event: IpcMainEvent,
      arg: {
        type: UpdateType
        payload: unknown
      }
    ) => {
      syrice && syrice.webContents.send(LyriceAction.LYRICE_UPDATE_RENDER, arg)
    }
  )
  ipcMain.on(ReadLocalFile.READ_MP3_FROM_PATH, (event, arg: string) => {
    const buffer = readFileSync(arg)
    event.returnValue = buffer
  })
  ipcMain.on(Dialog.SHOW_DIALOG, (event, arg) => {
    dialog
      .showOpenDialog(win, {
        title: '添加文件夹',
        properties: ['openDirectory', 'multiSelections']
      })
      .then(v => {
        event.returnValue = v
      })
  })
  ipcMain.on(AutoDownload.IS_UPGRADE, (e, upgrade) => {
    store.set('upgrade', upgrade)
  })
  ipcMain.on(AutoDownload.CHECK_UPGRADE, e => {
    autoUpdater.checkForUpdates().then(result => {
      win.webContents.send(AutoDownload.CHECK_UPGRADE, {
        version: result.updateInfo.version,
        path: result.updateInfo.path
      })
      log.debug('checkForUpdates', result)
    })
  })
  ipcMain.on(AutoDownload.UPGRADE_NOW, (e, upgrade) => {
    autoUpdater.quitAndInstall()
  })
}
