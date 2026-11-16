"""A review container for one person, as an inline Pulumi program."""
import sys
import pulumi
import pulumi_docker as docker
from pulumi import automation as auto

name = sys.argv[1]



def program():
    web = docker.Container(
        f"review-{name}",
        image="guestbook-app:v3",
        ports=[docker.ContainerPortArgs(internal=8080, external=8191)],
        envs=[f"TITLE=Python review copy for {name}"],
    )
    pulumi.export("container", web.name)
    pulumi.export("url", "http://localhost:8191")


stack = auto.create_or_select_stack(
    stack_name=name, project_name="guestbook-review-py", program=program)
res = stack.up()
url, container = res.outputs["url"].value, res.outputs["container"].value
print(res.summary.result, url, container)
stack.destroy()
stack.workspace.remove_stack(name)
print("removed", name)
