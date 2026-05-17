from abc import ABC, abstractmethod
from typing import Any


class BrowserAutomation(ABC):
    """Placeholder for Playwright-based browser control."""

    @abstractmethod
    async def navigate(self, url: str) -> None: ...

    @abstractmethod
    async def click(self, selector: str) -> None: ...


class OSAutomation(ABC):
    """Placeholder for desktop / OS-level automation."""

    @abstractmethod
    async def run_command(self, command: str) -> dict[str, Any]: ...


class StubBrowserAutomation(BrowserAutomation):
    async def navigate(self, url: str) -> None:
        raise NotImplementedError("Browser automation not implemented yet.")

    async def click(self, selector: str) -> None:
        raise NotImplementedError("Browser automation not implemented yet.")


class StubOSAutomation(OSAutomation):
    async def run_command(self, command: str) -> dict[str, Any]:
        raise NotImplementedError("OS automation not implemented yet.")
