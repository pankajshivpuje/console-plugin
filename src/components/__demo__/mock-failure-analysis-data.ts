import { FailureAnalysisData } from '../../types';

export const MOCK_FAILURE_ANALYSIS: Record<string, FailureAnalysisData> = {
  'buildah-deploy-run-9ab3f': {
    createdAt: '2025-11-09T09:25:00Z',
    duration: '7 minutes 45 seconds',
    reasonForFailure:
      'Task "deploy" failed: container "step-deploy" exited with code 1. Error: unable to connect to cluster endpoint. Connection refused at https://api.cluster.example.com:6443.',
    rootCause:
      'The deploy task failed because the Kubernetes API server endpoint was unreachable from the build cluster. This is typically caused by a network policy blocking egress traffic from the pipeline namespace, an expired or rotated kubeconfig credential, or the target cluster being temporarily unavailable during a maintenance window.',
    remediationSteps: [
      'Verify the target cluster API server is running and accessible: run "kubectl cluster-info" against the target kubeconfig.',
      'Check that the service account used by the pipeline has valid credentials and the kubeconfig secret has not expired.',
      'Review NetworkPolicy resources in the pipeline namespace to ensure egress to the cluster API endpoint (port 6443) is allowed.',
      'If the cluster was recently updated, re-generate the kubeconfig and update the corresponding Kubernetes Secret.',
      'Re-run the pipeline after confirming connectivity.',
    ],
  },
  'scan-and-deploy-run-m9n1p': {
    createdAt: '2025-07-10T13:48:00Z',
    duration: '15 minutes 55 seconds',
    reasonForFailure:
      'Task "scan-image" failed: container "step-scan" exited with code 2. Trivy scanner found 3 critical vulnerabilities (CVE-2025-1234, CVE-2025-5678, CVE-2025-9012) in image quay.io/myorg/myapp:latest.',
    rootCause:
      'The image vulnerability scan detected critical CVEs in base image dependencies. The trivy-scanner task is configured with --exit-code 2 for critical severity findings, causing the pipeline to fail before the deploy step. The vulnerabilities originate from outdated OpenSSL and glibc packages in the base image (ubi8/ubi-minimal:8.7).',
    remediationSteps: [
      'Update the base image to the latest patched version: change FROM ubi8/ubi-minimal:8.7 to ubi8/ubi-minimal:8.9 (or later) in your Dockerfile.',
      'Run "trivy image --severity CRITICAL your-image:tag" locally to verify the vulnerabilities are resolved after rebuilding.',
      'If the base image update is not immediately possible, review each CVE and add accepted-risk exceptions to the .trivyignore file with justification comments.',
      'Consider pinning base image digests instead of tags to prevent unexpected vulnerability regressions.',
      'Re-run the pipeline after updating the base image or configuring the scanner exceptions.',
    ],
  },
};
