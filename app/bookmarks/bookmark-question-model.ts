import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { EventData, Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { AdService } from "~/services/ad.service";
import { QuestionService } from "~/services/question.service";
import { IOption, IQuestion, State } from "~/shared/questions.model";
import * as navigationModule from "../shared/navigation";

export class BookmarkQuestionModel extends Observable {
    private _questions: Array<IQuestion> = [];
    private _question: IQuestion;
    private _questionNumber: number = 0;
    private _mode: string;

    constructor(questions: Array<IQuestion>, mode: string) {
        super();
        this._questions = questions;
        this._mode = mode;
    }

    showDrawer() {
        const sideDrawer = <RadSideDrawer>topmost().getViewById("sideDrawer");
        if (sideDrawer) {
            sideDrawer.showDrawer();
        }
        AdService.getInstance().hideAd();
    }

    previous(): void {
        AdService.getInstance().showInterstitial();
        if (this._questionNumber > 1) {
            this._questionNumber = this._questionNumber - 1;
            this._question = this._questions[this._questionNumber];
            this.publish();
        }
    }

    next(message: string): void {
        if (this._questions.length > this._questionNumber) {
            this._question = this._questions[this._questionNumber];
            this._questionNumber = this._questionNumber + 1;
            this.publish();
        } else {
            dialogs.confirm(message).then((proceed) => {
                if (proceed || this.length < 1) {
                    navigationModule.toPage("question/practice");
                }
            });
        }
    }

    flag(): void {
        QuestionService.getInstance().handleFlagQuestion(this._question);
        this.publish();
    }

    get question() {
        if (!this._question) {
            this._question = {description: "", options: [], explanation: "", show: false};
        }
        return this._question;
    }

    get options() {
        return this._question.options;
    }

    get questionNumber() {
        return this._questionNumber;
    }

    get flagged() {
        return this._question.flagged;
    }

    get length() {
        return this._questions.length;
    }

    publish() {
        this.notify({
            object: this,
            eventName: Observable.propertyChangeEvent,
            propertyName: "question",
            value: this._question
        });
        this.notify({
            object: this,
            eventName: Observable.propertyChangeEvent,
            propertyName: "options",
            value: this._question.options
        });
        this.notify({
            object: this,
            eventName: Observable.propertyChangeEvent,
            propertyName: "questionNumber",
            value: this._questionNumber
        });
    }

    showAnswer(): void {
        this.question.options.forEach((option) => option.show = true);
        this.question.show = true;
        this.publish();
    }

    selectOption(args: any) {
        const selectedOption: IOption = args.view.bindingContext;
        if (selectedOption.selected) {
            selectedOption.selected = false;
            this.question.skipped = true;
        } else {
            this.question.options.forEach((item, index) => {
                if (item.tag === selectedOption.tag) {
                    item.selected = true;
                } else {
                    item.selected = false;
                }
            });
            this.question.skipped = false;
        }
        this.publish();
        QuestionService.getInstance().handleWrongQuestions(this.question);
    }

    goToEditPage() {
        const state: State = {questions: [this.question], questionNumber: 1, totalQuestions: 1, mode: this._mode};
        navigationModule.gotoEditPage(state);
    }
}
