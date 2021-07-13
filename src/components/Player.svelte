<script>
  import { positionNameMap } from '../constants/string';

  import Answer from './Answer.svelte';

  export let player;
  export let isCurrentAnswering;
  export let isCorrect;
</script>

<div class="player-wrapper">
  <img src={`assets/${player.nationality}.png`} alt={player.nationality}>
  <Answer
    question={positionNameMap[player.position.toLowerCase()]}
    answer={player.ign}
    isCurrentAnswering={isCurrentAnswering}
    isCorrect={isCorrect}
  />
</div>

<style>

  .player-wrapper {
    display: flex;
    flex-direction: column;
  }
  img {
    margin: 0 15px;
    width: 87px;
  }

  @media (max-width: 799px) {
    img {
      margin: 0;
      width: 60px;
    }
  }

  @media (max-width: 320px) {
    img {
      width: 50px;
    }
  }
</style>