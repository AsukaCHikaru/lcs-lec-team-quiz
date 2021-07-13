<script>
  import { onMount } from 'svelte';

  import { data } from '../constants/quizzes';
  import Player from './Player.svelte';
  import Answer from './Answer.svelte';
  import Input from './Input.svelte';
  import SkipButton from './SkipButton.svelte';

  let quizNo;
  let answeredPool = [];
  let quiz;
  let answerForm;
  let currentQ = 'team';
  
  const fullPool = data.map((_, i) => i);
  const defaultAnswerForm = {
    team: { value: '', answer: [], correct: false },
    year: { value: '', answer: [], correct: false },
    split: { value: '', answer: [], correct: false },
    top: { value: '', answer: [], correct: false },
    jungle: { value: '', answer: [], correct: false },
    mid: { value: '', answer: [], correct: false },
    bot: { value: '', answer: [], correct: false },
    support: { value: '', answer: [], correct: false },
  };
  let qs = [...Object.keys(defaultAnswerForm)];

  function resetAnswerForm () {
    answerForm = JSON.parse(JSON.stringify(defaultAnswerForm));
  }

  function createQuiz () {
    resetAnswerForm();

    const pool = fullPool.filter(i => !answeredPool.includes(i));
    quizNo = pool[Math.floor(Math.random() * pool.length)];
    answeredPool.push(quizNo);
    quiz = data[quizNo];

    answerForm.team.answer = [...quiz.team.name.map(n => n.toLowerCase()), quiz.team.abbr.toLowerCase()];
    answerForm.year.answer = quiz.year;
    answerForm.split.answer = quiz.split.toLowerCase();
    answerForm.top.answer = quiz.players.TOP.ign.toLowerCase();
    answerForm.jungle.answer = quiz.players.JG.ign.toLowerCase();
    answerForm.mid.answer = quiz.players.MID.ign.toLowerCase();
    answerForm.bot.answer = quiz.players.BOT.ign.toLowerCase();
    answerForm.support.answer = quiz.players.SPT.ign.toLowerCase();
  }

  function handleInputChance (key, value) {
    answerForm[key].value = value;
  }
  
  function handleInputEnter (key) {
    if (
      key === "team" && answerForm.team.answer.includes(answerForm[key].value.toLowerCase()) || 
      key !== "team" && answerForm[key].answer === answerForm[key].value.toLowerCase()
    ) {
      answerForm[key].correct = true;
      qs.shift();
      if (qs.length === 0) {
        qs = [...Object.keys(defaultAnswerForm)];
        createQuiz();
      }
      currentQ = qs[0];
    }
  }

  onMount(() => {
    createQuiz();
  });

</script>

<div class="quiz-container">
  {#if quiz}
    <div class="player-container">
      <Player
        player={quiz.players.TOP}
        showAnswer={answerForm.top.correct}
        isCurrentAnswering={currentQ === 'top'}
        isCorrect={answerForm.top.correct}
      />
      <Player
        player={quiz.players.JG}
        showAnswer={answerForm.jungle.correct}
        isCurrentAnswering={currentQ === 'jungle'}
        isCorrect={answerForm.jungle.correct}
      />
      <Player
        player={quiz.players.MID}
        showAnswer={answerForm.mid.correct}
        isCurrentAnswering={currentQ === 'mid'}
        isCorrect={answerForm.mid.correct}
      />
      <Player
        player={quiz.players.BOT}
        showAnswer={answerForm.bot.correct}
        isCurrentAnswering={currentQ === 'bot'}
        isCorrect={answerForm.bot.correct}
      />
      <Player
        player={quiz.players.SPT}
        showAnswer={answerForm.support.correct}
        isCurrentAnswering={currentQ === 'support'}
        isCorrect={answerForm.support.correct}
      />
    </div>
    <div class="team-answer-container">
      <Answer
        question="Team"
        answer={quiz.team.abbr}
        isCurrentAnswering={currentQ === 'team'}
        isCorrect={answerForm.team.correct}
      />
      <Answer
        question="Year"
        answer={quiz.year}
        isCurrentAnswering={currentQ === 'year'}
        isCorrect={answerForm.year.correct}
      />
      <Answer
        question="Split"
        answer={quiz.split}
        isCurrentAnswering={currentQ === 'split'}
        isCorrect={answerForm.split.correct}
      />
    </div>
    <div class="input-container">
      <Input question={currentQ} onChange={handleInputChance} onEnter={handleInputEnter} value={answerForm[currentQ].value} />
    </div>
  {/if}
  <SkipButton onClick={createQuiz} />
</div>

<style>
  .quiz-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .player-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .team-answer-container {
    display: flex;
    justify-content: space-between;
    text-align: center;
    width: 60%;
  }
  .team-q-wrapper {
    width: 100px;
    margin: 10px 20px;
  }
  .input-container {
    text-align: center;
  }
</style>
