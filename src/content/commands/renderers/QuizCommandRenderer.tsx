import Quiz from "../../../quizzes/Quiz";
import type { CommandRenderer } from "../CommandRenderer";

const QuizCommandRenderer: CommandRenderer = {
    render(arguments_) {
        return <Quiz
            type={arguments_[0] ?? ""}
            source={arguments_[1] ?? ""}
            tolerance={Number(arguments_[2] ?? "0.01")}
            title={arguments_[3] ?? ""}
            unit={arguments_[4] ?? ""}
        />;
    },
};

export default QuizCommandRenderer;
