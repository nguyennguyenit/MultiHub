package updater

import (
	"strconv"
	"strings"
)

// isNewer returns true when candidate is strictly newer than current.
// Both strings should be "MAJOR.MINOR.PATCH" without a leading "v".
func isNewer(candidate, current string) bool {
	c := parseSemver(candidate)
	r := parseSemver(current)
	if c[0] != r[0] {
		return c[0] > r[0]
	}
	if c[1] != r[1] {
		return c[1] > r[1]
	}
	return c[2] > r[2]
}

func parseSemver(v string) [3]int {
	v = strings.TrimPrefix(v, "v")
	parts := strings.SplitN(v, ".", 3)
	var nums [3]int
	for i := 0; i < 3 && i < len(parts); i++ {
		nums[i], _ = strconv.Atoi(parts[i])
	}
	return nums
}
