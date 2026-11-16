import unittest
import pulumi

created = []


class Mocks(pulumi.runtime.Mocks):
    def new_resource(self, args):
        created.append(args)
        state = dict(args.inputs)
        if args.typ == "docker:index/volume:Volume":
            state["name"] = f"{args.name}-vol"
        return [f"{args.name}_id", state]

    def call(self, args):
        return {}


pulumi.runtime.set_mocks(
    Mocks(), project="guestbook-python", stack="test", preview=False)

from guestbook import Guestbook  # noqa: E402  (import after the mocks)


class TestGuestbook(unittest.TestCase):
    @pulumi.runtime.test
    def test_url_uses_port(self):
        app = Guestbook("t1", "img", 9001, "T")
        return app.url.apply(
            lambda url: self.assertEqual(url, "http://localhost:9001"))

    @pulumi.runtime.test
    def test_container_mounts_volume(self):
        app = Guestbook("t2", "img", 9002, "T")

        def check(_):
            c = next(r for r in created if r.name == "t2-web")
            ports = [{"internal": 8080, "external": 9002}]
            self.assertEqual(c.inputs["ports"], ports)
            vol = c.inputs["volumes"][0]["volumeName"]
            self.assertEqual(vol, "t2-data-vol")

        return app.container_name.apply(check)

