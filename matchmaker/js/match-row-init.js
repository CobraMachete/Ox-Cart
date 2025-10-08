window.initMatchupRow = function(target, opts){ 
	function initMatchupRow(
		target,
		{
			curatedTeams   = (window.curated_teams ?? []),
			specialsData   = (window.specials_data ?? null),
			structureData  = (window.structure_data ?? null),
			parseTeamString = async (s) => {
				const m = /\b([A-Z]{2,4})\b/.exec(s || '');
				return { code: m?.[1] || '', name: s };
			},
			icons = [
				{ icon: './img/sunny.svg',      state: 'Day'   },
				{ icon: './img/moon_stars.svg', state: 'Night' },
			],
			initialValue = {
				awaysearchbar: 'arizona state',
				homesearchbar: 'hawaii',
				'tricode-row-away': 'ASU',
				'school-row-away': 'Arizona State',
				'tricode-row-home': 'HAW',
				'school-row-home': 'University of Hawaii',
				'cal-text-input': '1025',
				currentIcon: { index: 0 },
			},
			onChange = (detail) => console.log('Row changed:', detail),
		} = {}
	) {
		const row = typeof target === 'string' ? document.querySelector(target) : target;
		if (!row) throw new Error('initMatchupRow: target element not found');
		
		// Provide datasets / hooks
		row.curatedTeams  = curatedTeams;
		row.specialsData  = specialsData;
		row.structureData = structureData;
		row.parseTeamString = parseTeamString;
		row.icons = icons;
		
		// Listen for updates
		const handler = (e) => onChange?.(e.detail, e);
		row.addEventListener('rowchange', handler);
		
		// Seed initial values (merge icons so you can override them if desired)
		row.value = { ...initialValue, icons };
		
		// Tiny API for convenience
		return {
			row,
			get value() { return row.value; },
			set value(v) { row.value = v; },
			destroy() { row.removeEventListener('rowchange', handler); },
		};
	}
};


