import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-multilevel-dialog',
  templateUrl: './multilevel-dialog.component.html',
  styleUrls: ['./multilevel-dialog.component.scss'],
})
export class MultilevelDialogComponent implements OnInit {
  currentQuestion: number = 1;
  answers: string[] = [];
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  selectedOption: string;

  constructor(private _formBuilder: FormBuilder) {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: [''],
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: [''],
    });
  }
  ngOnInit(): void {}

  showQuestion(answer: string, event: Event): void {
    if (this.currentQuestion > 1) {
      this.answers.push(answer);
    }

    const clickedButton = event.target as HTMLButtonElement;
    clickedButton.classList.add('selected');

    const nextQuestionElement = document.getElementById(
      `question${this.currentQuestion + 1}`,
    );

    if (this.currentQuestion === 4) {
      const resultElement = document.getElementById('result');
      const answersElement = document.getElementById('answers');
      answersElement.innerHTML = this.answers
        .map((answer) => `<li>${answer}</li>`)
        .join('');
      resultElement.style.display = 'block';
    } else {
      nextQuestionElement.style.display = 'block';
      this.currentQuestion++;
    }
  }
}
