import { Game } from './game/Game';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root saknas.');
}

const game = new Game(root);
game.start();
