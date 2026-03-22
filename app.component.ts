import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent }    from './components/header/header.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { KpiCardsComponent }  from './components/kpi-cards/kpi-cards.component';
import { ChartsComponent }    from './components/charts/charts.component';
import { TablesComponent }    from './components/tables/tables.component';
import { AiPanelComponent }   from './components/ai-panel/ai-panel.component';
import { SeoDataService }     from './services/seo-data.service';
import {
  KpiData, FilterConfig, TopPage,
  TopKeyword, AiRecommendation,
  TrafficPoint, KeywordClick
} from './models/seo.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FilterBarComponent,
    KpiCardsComponent,
    ChartsComponent,
    TablesComponent,
    AiPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loading = false;
  aiLoading = false;

  kpiData: KpiData | null = null;
  trafficData: TrafficPoint[] = [];
  keywordData: KeywordClick[] = [];
  pages: TopPage[] = [];
  keywords: TopKeyword[] = [];
  aiRecs: AiRecommendation[] = [];
  showAi = false;

  constructor(private seoService: SeoDataService) {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    let done = 0;
    const check = () => { if (++done === 4) this.loading = false; };

    this.seoService.getKpis().subscribe(d => { this.kpiData = d; check(); });
    this.seoService.getTrafficData().subscribe(d => { this.trafficData = d; check(); });
    this.seoService.getKeywordClicks().subscribe(d => { this.keywordData = d; check(); });
    this.seoService.getTopPages().subscribe(d => {
      this.pages = d;
      this.seoService.getTopKeywords().subscribe(k => { this.keywords = k; check(); });
    });
  }

  onFiltersApplied(_filters: FilterConfig) {
    this.loading = true;
    setTimeout(() => {
      this.loadAll();
    }, 0);
  }

  onSyncRequested() {
    this.loadAll();
  }

  onAiRequested() {
    this.aiLoading = true;
    this.showAi = false;
    this.seoService.getAiRecommendations().subscribe(recs => {
      this.aiRecs = recs;
      this.showAi = true;
      this.aiLoading = false;
      setTimeout(() => {
        document.getElementById('ai-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }
}
