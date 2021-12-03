import { AfterViewInit, Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../../../../../src/app/services/util/language.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ars-date-resolve',
  templateUrl: './ars-date-resolve.component.html',
  styleUrls: ['./ars-date-resolve.component.scss']
})
export class ArsDateResolveComponent implements OnInit, AfterViewInit {
  currentLang: string;

  constructor(
    public lang: LanguageService,
    public http: HttpClient
  ) { }

  ngOnInit(): void{
  }

  ngAfterViewInit(){
  }

}
