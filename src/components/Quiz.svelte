<script>
  import { onMount } from 'svelte';

  import { data } from '../constants/quizzes';
  import Player from './Player.svelte';
  import Input from './Input.svelte';
  import SkipButton from './SkipButton.svelte';

  let quiz;
  let answerForm;

  function resetAnswerForm () {
    answerForm = {
      team: { value: undefined, answer: [], correct: false },
      year: { value: undefined, answer: [], correct: false },
      split: { value: undefined, answer: [], correct: false },
      top: { value: undefined, answer: [], correct: false },
      jungle: { value: undefined, answer: [], correct: false },
      mid: { value: undefined, answer: [], correct: false },
      bot: { value: undefined, answer: [], correct: false },
      support: { value: undefined, answer: [], correct: false },
    };
  }

  function createQuiz () {
    resetAnswerForm();
    const rng = Math.floor(Math.random() * Object.entries(data).length);
    quiz = data[rng];
    answerForm.team.answer = [...quiz.team.name.map(n => n.toLowerCase()), quiz.team.abbr.toLowerCase()];
    answerForm.year.answer = quiz.year;
    answerForm.split.answer = quiz.split.toLowerCase();
    answerForm.top.answer = quiz.players.TOP.ign.toLowerCase();
    answerForm.jungle.answer = quiz.players.JG.ign.toLowerCase();
    answerForm.mid.answer = quiz.players.MID.ign.toLowerCase();
    answerForm.bot.answer = quiz.players.BOT.ign.toLowerCase();
    answerForm.support.answer = quiz.players.SPT.ign.toLowerCase();
  }

  function onInputChange (key, value) {
    answerForm[key].value = value;
    if (key === "team" && answerForm.team.answer.includes(value.toLowerCase()) || key !== "team" && answerForm[key].answer === value.toLowerCase()) {
      answerForm[key].correct = true;
    }
    if (Object.values(answerForm).filter(q => q.correct !== true).length === 0) {
      createQuiz();
    }
  }

  onMount(() => {
    createQuiz();
  });

</script>

<div class="quiz-container">
  {#if quiz}
    <div class="player-container">
      <Player player={quiz.players.TOP} />
      <Player player={quiz.players.JG} />
      <Player player={quiz.players.MID} />
      <Player player={quiz.players.BOT} />
      <Player player={quiz.players.SPT} />
    </div>
    <div class="team-input">
      <Input question="Team" onChange={onInputChange} />
      <Input question="Year" onChange={onInputChange} />
      <Input question="Split"onChange={onInputChange} />
    </div>
    <div class="player-name-input">
      <Input question="Top" onChange={onInputChange} />
      <Input question="Jungle" onChange={onInputChange} />
      <Input question="Mid" onChange={onInputChange} />
      <Input question="Bot" onChange={onInputChange} />
      <Input question="Support" onChange={onInputChange} /> 
    </div>
  {/if}
  <SkipButton onClick={createQuiz} />
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