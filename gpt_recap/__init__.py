"""
gpt_recap
=========

Utilities for analysing OpenAI ChatGPT `conversations.json` exports and
presenting the results as a Spotify-style recap.
"""

from importlib import metadata


def __getattr__(name: str):
    if name == "__version__":
        try:
            return metadata.version("gpt-recap")
        except metadata.PackageNotFoundError:
            return "0.1.0"
    raise AttributeError(name)


__all__ = ["__version__"]
