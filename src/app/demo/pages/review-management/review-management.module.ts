import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ReviewManagementComponent } from './review-management.component';
import { ReviewReportsComponent } from './review-reports/review-reports.component';

const routes: Routes = [
  { path: 'manage', component: ReviewManagementComponent },
  { path: 'reports', component: ReviewReportsComponent }
];

@NgModule({
  declarations: [ReviewManagementComponent, ReviewReportsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ReviewManagementModule {}
