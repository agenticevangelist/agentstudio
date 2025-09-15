## CI Pipeline

Stages: lint -> typecheck -> unit -> api -> integration -> build. Cache dependencies, parallelize test shards, and upload coverage. Block merge on failing gates or coverage regression. Nightly jobs run longer integration and smoke tests against staging.


