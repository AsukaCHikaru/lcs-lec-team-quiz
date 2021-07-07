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
  <div class="team-input">
    <Input question="Team" answer={[...quiz.team.name, quiz.team.abbr]} />
    <Input question="Year" answer={[quiz.year]} />
    <Input question="Split" answer={[quiz.split]} />
  </div>
  <div class="player-name-input">
    <Input question="Top" answer={[quiz.players.TOP.ign]} />
    <Input question="Jungle" answer={[quiz.players.JG.ign]} />
    <Input question="Mid" answer={[quiz.players.MID.ign]} />
    <Input question="Bot" answer={[quiz.players.BOT.ign]} />
    <Input question="Support" answer={[quiz.players.SPT.ign]} />
  </div>
</div>

<style>
  .quiz-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
  .player-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .team-input {
    margin: 1em 0;
  }
  .player-name-input {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
</style>