<script lang="ts">
	let { data, form } = $props();

	function formatBytes(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		const units = ['KB', 'MB', 'GB', 'TB'];
		let value = bytes;
		let unitIndex = -1;
		do {
			value /= 1024;
			unitIndex += 1;
		} while (value >= 1024 && unitIndex < units.length - 1);
		return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
	}
</script>

<section class="settings-page-v2">
	<header class="settings-top">
		<div>
			<p class="settings-eyebrow">Admin</p>
			<h1>Server settings</h1>
		</div>

		<a href="/account" class="btn-ghost">Back to settings</a>
	</header>

	<div class="settings-shell">
		<aside class="settings-sidebar" aria-label="Server settings sections">
			<a href="#resources" class="settings-sidebar-link active">Resources</a>
			<a href="#storage" class="settings-sidebar-link">Storage</a>
		</aside>

		<div class="settings-content">
			<section id="resources" class="settings-section">
				<div class="settings-section-heading">
					<h2>Resources</h2>
					<p>Global moderation and submission behavior.</p>
				</div>

				<form method="POST" action="?/settings">
					<div class="settings-row stacked">
						<div>
							<h3>Privileged auto-verify</h3>
							<p>Automatically verify resource submissions from prefects, teachers, and admins.</p>
						</div>

						<div class="settings-form-grid">
							<label class="settings-switch inline">
								<input
									name="autoVerifyPrivilegedResourceSubmissions"
									type="checkbox"
									checked={data.settings.autoVerifyPrivilegedResourceSubmissions}
								/>
								<span>Enable automatic verification</span>
							</label>

							{#if form?.message}
								<p class={form.success ? 'form-success' : 'form-error'}>
									{form.message}
								</p>
							{/if}

							<div>
								<button type="submit" class="btn">Save server settings</button>
							</div>
						</div>
					</div>
				</form>
			</section>

			<section id="storage" class="settings-section">
				<div class="settings-section-heading">
					<h2>File usage</h2>
					<p>Storage usage for uploaded resource files.</p>
				</div>

				<div class="settings-row">
					<div>
						<h3>Total usage</h3>
						<p>{data.fileUsage.totals.fileCount} files</p>
					</div>

					<div class="settings-status-success">{formatBytes(data.fileUsage.totals.totalBytes)}</div>
				</div>

				<div class="settings-table-wrap">
					<table class="settings-table">
						<thead>
							<tr>
								<th>User</th>
								<th>Role</th>
								<th>Files</th>
								<th>Storage</th>
							</tr>
						</thead>
						<tbody>
							{#each data.fileUsage.perUser as user}
								<tr>
									<td><a href={`/profile/${user.id}`}>{user.displayName}</a></td>
									<td>{user.role}</td>
									<td>{user.fileCount}</td>
									<td>{formatBytes(user.totalBytes)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	</div>
</section>
