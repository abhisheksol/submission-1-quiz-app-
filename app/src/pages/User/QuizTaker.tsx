import React, { useState, useEffect, FC } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { quizDetails } from './quiz_details_sample_data';
import { useAuth } from "../../context/AuthContext";
import axios from 'axios';
import { RiAiGenerate } from "react-icons/ri";

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  questionText: string;
  type: string;
  options?: string[];
  correctAnswer: string;
}

interface SubmissionStatus {
  status: string;
  message: string;
  score: number;
  totalQuestions: number;
}

const QuizDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const { isAuthenticated } = useAuth();

  const handleAiExplanation = async (questionId: string, questionText: string) => {
    const response = await axios({
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCVPgDqL2UWciZUqdl_GyE6cSjsc3CNjiA",
      method: "post",
      data: {
        "contents": [
          {
            "parts": [
              {
                text: `Explain this question donot give me answer: "${questionText}" generate 2 lines only.`,
              }
            ]
          }
        ]
      }
    });

    setExplanations((prevExplanations) => ({
      ...prevExplanations,
      [questionId]: response.data.candidates[0].content.parts[0].text,
    }));
  };

  useEffect(() => {
    if (id === quizDetails.id) {
      setQuiz(quizDetails);
    }
  }, [id]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    if (!id) {
      console.error("Quiz ID is undefined. Cannot submit quiz.");
      return;
    }
  
    const userAnswers = Object.keys(answers).map((questionId) => ({
      questionId,
      answer: answers[questionId],
    }));
  
    const response = mockSubmitQuiz(id, userAnswers);
    setSubmissionStatus(response);
  };
  
  const mockSubmitQuiz = (quizId: string, userAnswers: { questionId: string; answer: string }[]) => {
    let score = 0;
    userAnswers.forEach((answer) => {
      const question = quiz!.questions.find((q) => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.answer) {
        score += 1;
      }
    });

    return {
      status: "success",
      message: "Quiz submitted successfully!",
      score,
      totalQuestions: quiz!.questions.length,
    };
  };

  if (!quiz) return <p>Loading quiz details...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{quiz.title}</h1>
      <p className="text-lg mb-4">{quiz.description}</p>

      <div className="space-y-6">
        {quiz.questions.map((question) => (
          <div key={question.id} className="relative bg-slate-50 p-4 border border-gray-200 rounded-lg shadow-md">
            <div className="relative group">
              <button
                className="absolute top-4 right-4 bg-yellow-200 text-white p-2 rounded-full shadow hover:bg-blue-600"
                onClick={() => handleAiExplanation(question.id, question.questionText)}
              >
                <RiAiGenerate color='black' />
              </button>
              <div className="absolute top-12 right-0 bg-gray-800 text-white text-sm px-3 py-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Explain the question with AI
              </div>
            </div>

            <h2 className="text-xl font-semibold">{question.questionText}</h2>

            {explanations[question.id] && (
              <p className="mt-4 text-sm text-gray-700 italic">{explanations[question.id]}</p>
            )}

            {question.type === "multiple-choice" && (
              <div className="mt-4">
                {question.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <input
                      type="radio"
                      id={`${question.id}-option-${idx}`}
                      name={question.id}
                      value={option}
                      onChange={() => handleAnswerChange(question.id, option)}
                      className="mr-2"
                    />
                    <label htmlFor={`${question.id}-option-${idx}`}>{option}</label>
                  </div>
                ))}
              </div>
            )}

            {question.type === "true-false" && (
              <div className="mt-4">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`${question.id}-true`}
                    name={question.id}
                    value="True"
                    onChange={() => handleAnswerChange(question.id, "True")}
                    className="mr-2"
                  />
                  <label htmlFor={`${question.id}-true`}>True</label>
                </div>
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`${question.id}-false`}
                    name={question.id}
                    value="False"
                    onChange={() => handleAnswerChange(question.id, "False")}
                    className="mr-2"
                  />
                  <label htmlFor={`${question.id}-false`}>False</label>
                </div>
              </div>
            )}

            {question.type === "fill-in-the-blank" && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Your answer..."
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Submit Quiz
        </button>
      </div>

      {submissionStatus && (
        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-md">
          <p>{submissionStatus.message}</p>
          <p>
            Score: {submissionStatus.score} / {submissionStatus.totalQuestions}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizDetails;