"""The same Guestbook container, written in Python."""
import pulumi
import pulumi_docker as docker

image = docker.Image(
    "guestbook-image",
    image_name="guestbook-app:py",
    build=docker.DockerBuildArgs(context="../app"),
    skip_push=True,
)

container = docker.Container(
    "guestbook-web",
    name="guestbook-python",
    image=image.image_name,
    ports=[docker.ContainerPortArgs(internal=8080, external=8082)],
    envs=["TITLE=Guestbook (Python)"],
)

pulumi.export("url", "http://localhost:8082")
pulumi.export("broken", f"container {container.name}")
pulumi.export(
    "joined", pulumi.Output.concat("container ", container.name)
)
pulumi.export(
    "formatted",
    pulumi.Output.format("{0} on port {1}", container.name, 8082),
)
pulumi.export("upper", container.name.apply(lambda n: n.upper()))
pulumi.export(
    "both",
    pulumi.Output.all(container.name, image.image_name).apply(
        lambda v: f"{v[0]} runs {v[1]}"
    ),
)
pulumi.export(
    "named",
    pulumi.Output.all(name=container.name, port=8082).apply(
        lambda d: f"{d['name']} listens on {d['port']}"
    ),
)
