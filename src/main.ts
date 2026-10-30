import './style.css'
import { Game } from './game/Game'

const host = document.querySelector<HTMLElement>('#app')
if (!host) throw new Error('Missing #app')

const game = new Game(host)
game.start()
