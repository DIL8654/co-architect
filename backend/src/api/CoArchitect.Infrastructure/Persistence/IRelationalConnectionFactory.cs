using System.Data.Common;

namespace CoArchitect.Infrastructure.Persistence;

public interface IRelationalConnectionFactory
{
    Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken);
}
