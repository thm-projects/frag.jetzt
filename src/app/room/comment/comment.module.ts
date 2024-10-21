import { NgModule } from '@angular/core';
import { CommentComponent } from './comment/comment.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { CommentHeaderActionComponent } from './comment-header-action/comment-header-action.component';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@NgModule({
  declarations: [CommentComponent, CommentHeaderActionComponent],
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CustomMarkdownModule,
    ContextPipe,
    MatMenuModule,
    MatBadgeModule,
  ],
  exports: [CommentComponent],
})
export class CommentModule {}
