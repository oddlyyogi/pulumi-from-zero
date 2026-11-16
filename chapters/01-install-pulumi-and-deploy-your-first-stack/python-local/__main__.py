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
