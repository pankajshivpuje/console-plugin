export const MOCK_PIPELINE_YAML = `apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: s2i-build-and-deploy
  namespace: openshift-pipelines
spec:
  params:
    - name: IMAGE_NAME
      type: string
    - name: GIT_REPO
      type: string
    - name: GIT_REVISION
      type: string
  workspaces:
    - name: workspace
  tasks:
    - name: fetch-repository
      taskRef:
        resolver: cluster
      params:
        - name: kind
          value: task
        - name: name
          value: git-clone
        - name: namespace
          value: openshift-pipelines
      workspaces:
        - name: output
          workspace: workspace
      params:
        - name: URL
          value: $(params.GIT_REPO)
        - name: REVISION
          value: $(params.GIT_REVISION)
        - name: SUBDIRECTORY
          value: ""
        - name: DELETE_EXISTING
          value: "true"
    - name: build
      taskRef:
        resolver: cluster
      params:
        - name: kind
          value: task
        - name: name
          value: s2i-java
        - name: namespace
          value: openshift-pipelines
      runAfter:
        - fetch-repository
      workspaces:
        - name: source
          workspace: workspace
      params:
        - name: IMAGE
          value: $(params.IMAGE_NAME)
    - name: deploy
      taskRef:
        resolver: cluster
      params:
        - name: kind
          value: task
        - name: name
          value: openshift-client
        - name: namespace
          value: openshift-pipelines
      runAfter:
        - build
      params:
        - name: SCRIPT
          value: oc rollout restart deployment/$(params.IMAGE_NAME)`;

export const MOCK_SBOM_TASK_YAML = `    - name: generate-sbom
      taskRef:
        resolver: cluster
      params:
        - name: kind
          value: task
        - name: name
          value: syft-sbom
        - name: namespace
          value: openshift-pipelines
      runAfter:
        - build
      workspaces:
        - name: source
          workspace: workspace
      params:
        - name: IMAGE
          value: $(params.IMAGE_NAME)`;
