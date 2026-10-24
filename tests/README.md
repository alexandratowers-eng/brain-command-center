# Sync tests

Two-device sync scenarios run against the real app in headless Chrome with a
fake GitHub gist in between. Each "device" is its own browser context with its
own localStorage, using the real save() and SyncEngine merge code.

    python3 -m venv /tmp/pwenv && /tmp/pwenv/bin/pip install playwright
    python3 -m http.server 8765 &            # from the repo root
    /tmp/pwenv/bin/python3 tests/sync_two_device.py
    /tmp/pwenv/bin/python3 tests/sync_extra.py

Uses the Google Chrome binary in /Applications. Test dates are in 2027 so the
seeded Brem class blocks don't interfere.
