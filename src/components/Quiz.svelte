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
      team: { value: '', answer: [], correct: false },
      year: { value: '', answer: [], correct: false },
      split: { value: '', answer: [], correct: false },
      top: { value: '', answer: [], correct: false },
      jungle: { value: '', answer: [], correct: false },
      mid: { value: '', answer: [], correct: false },
      bot: { value: '', answer: [], correct: false },
      support: { value: '', answer: [], correct: false },
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
    if (
      key === "team" && answerForm.team.answer.includes(answerForm[key].value.toLowerCase()) || 
      key !== "team" && answerForm[key].answer === answerForm[key].value.toLowerCase()
    ) {
      answerForm[key].correct = true;
      console.log(answerForm);
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
      <Input
        question="Team"
        onChange={onInputChange}
        value={answerForm.team.value}
      />
      <Input
        question="Year"
        onChange={onInputChange}
        value={answerForm.year.value}
      />
      <Input
        question="Split"
        onChange={onInputChange}
        value={answerForm.split.value}
      />
    </div>
    <div class="player-name-input">
      <Input
        question="Top"
        onChange={onInputChange}
        value={answerForm.top.value}
      />
      <Input
        question="Jungle"
        onChange={onInputChange}
        value={answerForm.jungle.value}
      />
      <Input
        question="Mid"
        onChange={onInputChange}
        value={answerForm.mid.value}
      />
      <Input
        question="Bot"
        onChange={onInputChange}
        value={answerForm.bot.value}
      />
      <Input
        question="Support"
        onChange={onInputChange}
        value={answerForm.support.value}
      />
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
