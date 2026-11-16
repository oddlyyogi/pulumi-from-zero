"""Deploy the Python Guestbook for one person, with the Automation API."""
import sys
from pulumi import automation as auto

name = sys.argv[1]
action = sys.argv[2] if len(sys.argv) > 2 else "up"

stack = auto.create_or_select_stack(
    stack_name=name, work_dir="../python-local")
if action == "destroy":
    stack.destroy()
    stack.workspace.remove_stack(name)
    print(f"removed {name}")
else:
    stack.set_config("port", auto.ConfigValue(value="8189"))
    result = stack.up(on_output=print)
    print(f"{result.summary.result}: {result.outputs['url'].value}")
