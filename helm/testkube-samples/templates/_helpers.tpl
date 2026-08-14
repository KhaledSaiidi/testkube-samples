{{/*
Chart name.
*/}}
{{- define "testkube-samples.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Release-scoped name.
*/}}
{{- define "testkube-samples.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Component-scoped name.
Usage: include "testkube-samples.componentName" (dict "root" . "component" "api")
*/}}
{{- define "testkube-samples.componentName" -}}
{{- printf "%s-%s" (include "testkube-samples.fullname" .root) .component | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Selector labels are immutable and must distinguish API from web.
*/}}
{{- define "testkube-samples.selectorLabels" -}}
app.kubernetes.io/name: {{ include "testkube-samples.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Common resource labels.
*/}}
{{- define "testkube-samples.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .root.Chart.Name .root.Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{ include "testkube-samples.selectorLabels" . }}
app.kubernetes.io/part-of: {{ include "testkube-samples.name" .root }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
{{- end }}
