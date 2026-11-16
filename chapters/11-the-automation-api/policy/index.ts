import * as docker from "@pulumi/docker";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

new PolicyPack("guestbook-policies", {
  policies: [{
    name: "container-memory-cap",
    description: "Containers need a memory limit no larger than the cap.",
    enforcementLevel: "mandatory",
    configSchema: {
      properties: { maxMemoryMb: { type: "number", default: 256 } },
    },
    validateResource: validateResourceOfType(docker.Container,
      (c, args, reportViolation) => {
        const { maxMemoryMb } = args.getConfig<{ maxMemoryMb: number }>();
        if (!c.memory) {
          reportViolation("Set a memory limit on every container.");
        } else if (c.memory > maxMemoryMb) {
          reportViolation(
            `Memory ${c.memory} MB is above the cap of ${maxMemoryMb} MB.`);
        }
      }),
  }, {
    name: "port-range",
    description: "Published ports stay between 8000 and 8999.",
    enforcementLevel: "advisory",
    validateResource: validateResourceOfType(docker.Container,
      (c, args, reportViolation) => {
        for (const p of c.ports ?? []) {
          const ext = p.external ?? 0;
          if (ext < 8000 || ext > 8999) {
            reportViolation(`Port ${ext} is outside 8000-8999.`);
          }
        }
      }),
  }, {
    name: "max-containers",
    description: "A stack runs at most a few containers.",
    enforcementLevel: "mandatory",
    configSchema: { properties: { max: { type: "number", default: 3 } } },
    validateStack: (args, reportViolation) => {
      const { max } = args.getConfig<{ max: number }>();
      const n = args.resources
        .filter((r) => r.isType(docker.Container)).length;
      if (n > max) {
        reportViolation(`${n} containers, the limit is ${max}.`);
      }
    },
  }, {
    name: "restart-policy",
    description: "Containers restart unless stopped.",
    enforcementLevel: "remediate",
    remediateResource: (args) => {
      if (args.type === "docker:index/container:Container"
          && args.props.restart !== "unless-stopped") {
        return { ...args.props, restart: "unless-stopped" };
      }
      return undefined;
    },
  }],
});
