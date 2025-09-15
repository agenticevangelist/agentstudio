class AgentError(Exception):
    pass


class NotFoundError(AgentError):
    pass


class UnauthorizedError(AgentError):
    pass
