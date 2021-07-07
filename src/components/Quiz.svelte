<script>
  import { data } from '../constants/quizzes';
  import Player from './Player.svelte';
  import Input from './Input.svelte';

  const rng = Math.floor(Math.random() * Object.entries(data).length);
  const quiz = data[rng];
</script>

<div class="quiz-container">
  <div class="player-container">
    <Player player={quiz.players.TOP} />
    <Player player={quiz.players.JG} />
    <Player player={quiz.players.MID} />
    <Player player={quiz.players.BOT} />
    <Player player={quiz.players.SPT} />
  </div>
  <Input question="TEAM" answer={[...quiz.team.name, quiz.team.abbr]} />
  <Input question="YEAR" answer={[quiz.year]} />
  <Input question="SPLIT" answer={[quiz.split]} />
</div>

<style>
  .quiz-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .player-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
</style>