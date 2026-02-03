import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSAPage } from './home-sa.page';

describe('HomeSAPage', () => {
  let component: HomeSAPage;
  let fixture: ComponentFixture<HomeSAPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HomeSAPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
