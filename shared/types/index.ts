export interface ReportTemplateTheme {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  border_style: string;
  header_layout: string;
}

export interface ReportLayoutVisibility {
  show_class_position: boolean;
  show_class_average: boolean;
  show_behavior_notes: boolean;
  show_principal_signature: boolean;
  show_teacher_signature: boolean;
}

export interface ReportDataStructure {
  columns_enabled: Array<'ca_1' | 'ca_2' | 'exam' | 'total'>;
  column_labels: {
    ca_1?: string;
    ca_2?: string;
    exam?: string;
    total?: string;
  };
}

export interface GradingScaleBand {
  min: number;
  max: number;
  grade: string;
  remark?: string;
}

export interface ReportTemplateConfig {
  theme: ReportTemplateTheme;
  layout_visibility: ReportLayoutVisibility;
  data_structure: ReportDataStructure;
  grading_scale: GradingScaleBand[];
}
