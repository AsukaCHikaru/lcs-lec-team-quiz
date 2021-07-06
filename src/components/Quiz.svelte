<script>
  import { data } from '../constants/teams';
  import Player from './Player.svelte';

  const rng = Math.floor(Math.random() * Object.entries(data).length);
  const quiz = data[rng];
</script>

<div class="quiz-container">
  <Player player={quiz.players.TOP} />
  <Player player={quiz.players.JG} />
  <Player player={quiz.players.MID} />
  <Player player={quiz.players.BOT} />
  <Player player={quiz.players.SPT} />
</div>

<style>
  .quiz-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
</style>