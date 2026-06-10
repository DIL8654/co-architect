using System.Security.Cryptography;
using System.Text;

namespace CoArchitect.Api.Services;

public static class DeterministicGuid
{
    public static Guid Create(string source)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(source));
        Span<byte> guidBytes = stackalloc byte[16];
        bytes.AsSpan(0, 16).CopyTo(guidBytes);
        return new Guid(guidBytes);
    }
}
