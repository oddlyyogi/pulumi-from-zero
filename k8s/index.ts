import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();
const replicas = config.getNumber("replicas") ?? 2;

const provider = new k8s.Provider("kind", {
  context: "kind-guestbook",
});
const opts = { provider };

const ns = new k8s.core.v1.Namespace("guestbook", {
  metadata: { name: "guestbook" },
}, opts);
const namespace = ns.metadata.name;

const settings = new k8s.core.v1.ConfigMap("settings", {
  metadata: { namespace },
  data: { TITLE: "Guestbook on kind" },
}, opts);

const admin = new k8s.core.v1.Secret("admin", {
  metadata: { namespace },
  stringData: { ADMIN_TOKEN: config.requireSecret("adminToken") },
}, opts);

const labels = { app: "guestbook" };

const web = new k8s.apps.v1.Deployment("web", {
  metadata: {
    namespace,
    annotations: { "pulumi.com/patchForce": "true" },
  },
  spec: {
    replicas,
    selector: { matchLabels: labels },
    strategy: {
      rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
    },
    template: {
      metadata: { labels },
      spec: {
        containers: [{
          name: "web",
          image: "guestbook-app:k8s-v2",
          imagePullPolicy: "IfNotPresent",
          ports: [{ containerPort: 8080 }],
          envFrom: [
            { configMapRef: { name: settings.metadata.name } },
            { secretRef: { name: admin.metadata.name } },
          ],
          resources: {
            requests: { cpu: "50m", memory: "64Mi" },
            limits: { memory: "128Mi" },
          },
          readinessProbe: {
            httpGet: { path: "/api/messages", port: 8080 },
          },
        }],
      },
    },
  },
}, {
  ...opts,
  customTimeouts: { create: "2m", update: "2m" },
  deletedWith: ns,
});

export const deployment = web.metadata.name;

const svc = new k8s.core.v1.Service("web", {
  metadata: { namespace },
  spec: {
    selector: labels,
    ports: [{ port: 80, targetPort: 8080 }],
  },
}, opts);
export const service = svc.metadata.name;


const podinfo = new k8s.helm.v4.Chart("podinfo", {
  chart: "podinfo",
  version: "6.17.0",
  namespace,
  repositoryOpts: { repo: "https://stefanprodan.github.io/podinfo" },
  values: {
    replicaCount: 3,
    ui: { message: "Installed by Pulumi" },
  },
}, opts);


const quota = new k8s.yaml.v2.ConfigFile("quota", {
  file: "quota.yaml",
}, { ...opts, dependsOn: [ns] });


const render = new k8s.Provider("render", {
  renderYamlToDirectory: "rendered",
});
new k8s.core.v1.ConfigMap("rendered-settings", {
  metadata: { name: "rendered-settings", namespace: "guestbook" },
  data: { TITLE: "Rendered, not applied" },
}, { provider: render });
