
using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace server
{
	public class Startup
	{
		public static void Main(string[] args)
		{
			var dappDirectoryPath = Directory.GetParent(Directory.GetCurrentDirectory()).FullName;
			var clientDirectoryPath = Path.Combine(dappDirectoryPath, "client");
			new WebHostBuilder()
				.ConfigureLogging((context, factory) =>
				{
					factory.AddFilter(new Dictionary<String, LogLevel> { ["Default"] = LogLevel.Trace });
					factory.AddConsole();
				})
				.UseKestrel()
				.UseContentRoot(clientDirectoryPath)
				.UseWebRoot("")
				.UseStartup<Startup>()
				.Build()
				.Run();
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder applicationBuilder, IHostingEnvironment hostingEnvironment, ILogger<Startup> logger)
		{
			applicationBuilder.UseDefaultFiles();
			applicationBuilder.UseStaticFiles();
		}
	}
}
