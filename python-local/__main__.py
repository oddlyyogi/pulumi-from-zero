"""The Guestbook in Python, as a component."""
import pulumi
import pulumi_docker as docker
from guestbook import Guestbook

config = pulumi.Config()
port = config.require_int("port")
image = docker.Image(
    "guestbook-image",
    image_name="guestbook-app:py",
    build=docker.DockerBuildArgs(context="../app"),
    skip_push=True,
)

app = Guestbook(
    "py", image.image_name, port, "Guestbook (Python component)"
)
pulumi.export("url", app.url)
pulumi.export("container", app.container_name)
