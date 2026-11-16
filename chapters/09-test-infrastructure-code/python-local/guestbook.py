"""A Guestbook container and its volume, as one component."""
import pulumi
import pulumi_docker as docker


class Guestbook(pulumi.ComponentResource):
    def __init__(self, name, image, port, title, opts=None):
        super().__init__("guestbook:app:Guestbook", name, None, opts)
        child = pulumi.ResourceOptions(parent=self)
        data = docker.Volume(f"{name}-data", opts=child)
        container = docker.Container(
            f"{name}-web",
            image=image,
            ports=[docker.ContainerPortArgs(internal=8080, external=port)],
            envs=[f"TITLE={title}"],
            volumes=[docker.ContainerVolumeArgs(
                volume_name=data.name, container_path="/data")],
            opts=child,
        )
        self.url = pulumi.Output.from_input(f"http://localhost:{port}")
        self.container_name = container.name
        self.register_outputs({"url": self.url})
